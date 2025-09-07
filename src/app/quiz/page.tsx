
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel as ShadFormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, Lightbulb, Sparkles, CheckCircle2, XCircle, Shuffle, Gamepad2, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  POINTS_PER_MCQ_CORRECT,
  POINTS_PER_TRUE_FALSE_CORRECT,
  POINTS_PER_FILL_BLANK_CORRECT,
  POINTS_PER_MATCHING_CORRECT
} from '@/lib/constants';
import { QuizTopicFormData, MatchingTopicFormData, QuizTopicSchema, MatchingTopicSchema } from '@/lib/schemas';

import { generateMcqs, type McqQuestion } from '@/ai/flows/generate-mcq-flow';
import { generateTrueFalses, type TrueFalseQuestion } from '@/ai/flows/generate-true-false-flow';
import { generateFillBlanks, type FillBlankQuestion } from '@/ai/flows/generate-fill-blank-flow';
import { generateMatchingPairs, type GenerateMatchingPairsOutput } from '@/ai/flows/generate-matching-pairs-flow';


// --- Interactive Question Components ---

const McqComponent = ({ question, onCorrect, onAnswered, questionNumber }: { question: McqQuestion, onCorrect: () => void, onAnswered: (isCorrect: boolean) => void, questionNumber: number }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const isCorrect = index === question.correctAnswerIndex;
    if (isCorrect) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_PER_MCQ_CORRECT} XP!` });
    } else {
      toast({ title: 'Not quite!', variant: 'destructive' });
    }
    onAnswered(isCorrect);
  };

  return (
    <Card className="shadow-md">
      <CardHeader><CardTitle className="font-headline text-lg">Question {questionNumber}: {question.question}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = question.correctAnswerIndex === index;
          const hasBeenAnswered = selectedIndex !== null;
          return (
            <Button
              key={index} variant="outline" onClick={() => handleSelect(index)} disabled={hasBeenAnswered}
              className={cn("justify-start text-left h-auto whitespace-normal py-2", hasBeenAnswered && isCorrect && "border-green-500 bg-green-500/10", hasBeenAnswered && !isCorrect && isSelected && "border-red-500 bg-red-500/10", "disabled:opacity-100 disabled:cursor-not-allowed")}
            >
              {option}
              {hasBeenAnswered && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />}
              {hasBeenAnswered && !isCorrect && isSelected && <XCircle className="ml-auto h-5 w-5 text-red-500" />}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

const TrueFalseComponent = ({ question, onCorrect, onAnswered, questionNumber }: { question: TrueFalseQuestion, onCorrect: () => void, onAnswered: (isCorrect: boolean) => void, questionNumber: number }) => {
  const [selected, setSelected] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleSelect = (answer: boolean) => {
    if (selected !== null) return;
    setSelected(answer);
    const isCorrect = answer === question.isTrue;
    if (isCorrect) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_PER_TRUE_FALSE_CORRECT} XP!` });
    } else {
      toast({ title: 'Incorrect!', variant: 'destructive' });
    }
    onAnswered(isCorrect);
  };

  return (
    <Card className="shadow-md">
      <CardHeader><CardTitle className="font-headline text-lg">Question {questionNumber}: {question.statement}</CardTitle></CardHeader>
      <CardContent className="flex gap-4 justify-center">
        {[true, false].map(val => (
          <Button
            key={String(val)} onClick={() => handleSelect(val)} disabled={selected !== null}
            className={cn("w-24", selected !== null && (question.isTrue === val ? "border-green-500 bg-green-500/10" : (selected === val ? "border-red-500 bg-red-500/10" : "")), "disabled:opacity-100 disabled:cursor-not-allowed")}
          >
            {val ? "True" : "False"}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

const FillBlankComponent = ({ question, onCorrect, onAnswered, questionNumber }: { question: FillBlankQuestion, onCorrect: () => void, onAnswered: (isCorrect: boolean) => void, questionNumber: number }) => {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleCheck = () => {
    if (submitted) return;
    setSubmitted(true);
    const isCorrect = answer.trim().toLowerCase() === question.answer.toLowerCase();
    if (isCorrect) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_PER_FILL_BLANK_CORRECT} XP!` });
    } else {
      toast({ title: 'Not quite!', description: `Correct answer: ${question.answer}`, variant: 'destructive' });
    }
    onAnswered(isCorrect);
  };
  const parts = question.question.split('[BLANK]');
  return (
    <Card className="shadow-md">
      <CardHeader><CardTitle className="font-headline text-lg">Question {questionNumber}: Fill in the blank</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <span>{parts[0]}</span>
        <Input value={answer} onChange={e => setAnswer(e.target.value)} disabled={submitted} onKeyDown={e => e.key === 'Enter' && handleCheck()} className="w-40" />
        <span>{parts[1]}</span>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCheck} disabled={submitted}>Check Answer</Button>
      </CardFooter>
    </Card>
  );
};

const MatchingPairsComponent = ({ pairs, onCorrect, onAnswered }: { pairs: GenerateMatchingPairsOutput['pairs'], onCorrect: (points: number) => void, onAnswered: (isCorrect: boolean) => void }) => {
    const [shuffledDefs, setShuffledDefs] = useState<{ id: number; text: string }[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<{ id: number; text: string } | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        setShuffledDefs(
            pairs
                .map((p, i) => ({ id: i, text: p.definition }))
                .sort(() => Math.random() - 0.5)
        );
        setMatchedPairs([]);
        setSelectedTerm(null);
    }, [pairs]);

    const handleTermClick = (term: string, index: number) => {
        if (matchedPairs.includes(index)) return;
        setSelectedTerm({ id: index, text: term });
    };
    
    const handleDefClick = (def: string, index: number) => {
        if (!selectedTerm || matchedPairs.includes(selectedTerm.id)) return;

        const isCorrect = pairs[selectedTerm.id].definition === def;
        if (isCorrect) {
            const newMatchedPairs = [...matchedPairs, selectedTerm.id];
            setMatchedPairs(newMatchedPairs);
            toast({ title: 'Match Found!', description: `Great job! +${POINTS_PER_MATCHING_CORRECT} XP!` });
            onCorrect(POINTS_PER_MATCHING_CORRECT);
            onAnswered(true); // Pass true for correct answer

            if (newMatchedPairs.length === pairs.length) {
                toast({ title: 'Challenge Complete!', description: `You matched all pairs!` });
            }
        } else {
            toast({ title: 'Not a match!', description: 'Try again.', variant: 'destructive' });
            onAnswered(false); // Pass false for incorrect answer
        }
        setSelectedTerm(null);
    };

    return (
        <Card className="shadow-md mt-6">
            <CardHeader><CardTitle className="font-headline text-lg">Match the Terms and Definitions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h3 className="font-semibold text-center text-primary">Terms</h3>
                    {pairs.map((p, i) => (
                        <Button
                            key={`term-${i}`} variant="outline" onClick={() => handleTermClick(p.term, i)}
                            disabled={matchedPairs.includes(i)}
                            className={cn("w-full h-auto text-left justify-start p-2 whitespace-normal", selectedTerm?.id === i && "ring-2 ring-primary", matchedPairs.includes(i) && "bg-green-100 border-green-300 text-muted-foreground")}
                        >
                            {p.term}
                        </Button>
                    ))}
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-center text-primary">Definitions</h3>
                     {shuffledDefs.map((d, i) => {
                        const originalIndex = pairs.findIndex(p => p.definition === d.text);
                        const isMatched = matchedPairs.includes(originalIndex);
                        return (
                            <Button
                                key={`def-${i}`} variant="outline" onClick={() => handleDefClick(d.text, i)}
                                disabled={isMatched}
                                className={cn("w-full h-auto text-left justify-start p-2 whitespace-normal", isMatched && "bg-green-100 border-green-300 text-muted-foreground")}
                            >
                                {d.text}
                            </Button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

// --- Main Page Component ---

type QuizType = 'mcq' | 'trueFalse' | 'fillBlank' | 'matching';

interface QuizSession {
    topic: string;
    questions: any[];
    pairs: GenerateMatchingPairsOutput['pairs'] | null;
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
}

const initialQuizSession: QuizSession = {
    topic: '',
    questions: [],
    pairs: null,
    totalQuestions: 0,
    answeredQuestions: 0,
    correctAnswers: 0,
};

export default function QuizPage() {
    const { isAuthenticated, loading: authLoading, addPoints, addMysteryBox } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [mcqSession, setMcqSession] = useState<QuizSession>(initialQuizSession);
    const [trueFalseSession, setTrueFalseSession] = useState<QuizSession>(initialQuizSession);
    const [fillBlankSession, setFillBlankSession] = useState<QuizSession>(initialQuizSession);
    const [matchingSession, setMatchingSession] = useState<QuizSession>(initialQuizSession);

    const [loading, setLoading] = useState({ mcq: false, trueFalse: false, fillBlank: false, matching: false });

    // Forms
    const mcqForm = useForm<QuizTopicFormData>({ resolver: zodResolver(QuizTopicSchema), defaultValues: { topic: '', numQuestions: 3 } });
    const trueFalseForm = useForm<QuizTopicFormData>({ resolver: zodResolver(QuizTopicSchema), defaultValues: { topic: '', numQuestions: 3 } });
    const fillBlankForm = useForm<QuizTopicFormData>({ resolver: zodResolver(QuizTopicSchema), defaultValues: { topic: '', numQuestions: 3 } });
    const matchingForm = useForm<MatchingTopicFormData>({ resolver: zodResolver(MatchingTopicSchema), defaultValues: { topic: '', numPairs: 4 } });

    // Auth redirection
    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login?redirect=/quiz');
    }, [authLoading, isAuthenticated, router]);

    const awardMysteryBox = useCallback(() => {
        addMysteryBox({ id: Date.now().toString(), tier: 'Common', collectedAt: new Date() }); // Tier is for display, real tier is decided on open
        toast({
            title: "Mystery Box Awarded!",
            description: "You've earned a Mystery Box! Check your inventory on the Progress page.",
            action: <div className="p-2"><Gift className="h-8 w-8 text-accent" /></div>,
        });
    }, [addMysteryBox, toast]);
    
    const checkQuizCompletion = useCallback((session: QuizSession) => {
        if (session.totalQuestions > 0 && session.answeredQuestions === session.totalQuestions) {
            toast({
                title: 'Quiz Complete!',
                description: `You scored ${session.correctAnswers} out of ${session.totalQuestions}.`
            });
            if (session.correctAnswers === session.totalQuestions) {
                toast({ title: "Perfect Score!", description: "Incredible! You've earned a special reward." });
                awardMysteryBox();
            } else {
                 if (Math.random() < 0.1) { // 10% chance
                    awardMysteryBox();
                }
            }
        }
    }, [awardMysteryBox, toast]);

    const handleCorrectAnswer = (points: number) => {
        addPoints(points);
    };

    const handleQuestionAnswered = (type: QuizType, isCorrect: boolean) => {
      const getSessionUpdater = (prevSession: QuizSession) => {
          const newSession = {
            ...prevSession,
            answeredQuestions: prevSession.answeredQuestions + 1,
            correctAnswers: isCorrect ? prevSession.correctAnswers + 1 : prevSession.correctAnswers,
          };
          checkQuizCompletion(newSession);
          return newSession;
      };

      if (type === 'mcq') setMcqSession(getSessionUpdater);
      else if (type === 'trueFalse') setTrueFalseSession(getSessionUpdater);
      else if (type === 'fillBlank') setFillBlankSession(getSessionUpdater);
      // Matching is handled slightly differently since each pair is an "answer"
    };
    
    const handleMatchingAnswered = (isCorrect: boolean) => {
        const getSessionUpdater = (prevSession: QuizSession) => {
            const newSession = {
              ...prevSession,
              // Only increment answeredQuestions for correct answers in matching to avoid penalizing for wrong guesses
              answeredQuestions: isCorrect ? prevSession.answeredQuestions + 1 : prevSession.answeredQuestions,
              correctAnswers: isCorrect ? prevSession.correctAnswers + 1 : prevSession.correctAnswers,
            };
            if(isCorrect) {
              checkQuizCompletion(newSession);
            }
            return newSession;
        };
        setMatchingSession(getSessionUpdater);
    };


    const handleGenerate = async (type: QuizType, data: QuizTopicFormData | MatchingTopicFormData) => {
        setLoading(prev => ({ ...prev, [type]: true }));
        
        const resetSession = (topic: string, questions: any[], pairs: any[] | null = null): QuizSession => ({
            topic,
            questions: pairs ? [] : questions, // Matching component uses pairs directly
            pairs: pairs,
            totalQuestions: pairs ? pairs.length : questions.length,
            answeredQuestions: 0,
            correctAnswers: 0,
        });

        try {
            if (type === 'mcq' && 'numQuestions' in data) {
                 const result = await generateMcqs({ topic: data.topic, numQuestions: data.numQuestions });
                 if (result?.questions?.length) {
                    setMcqSession(resetSession(data.topic, result.questions));
                 } else {
                   toast({ title: 'Generation Failed', description: 'Could not generate MCQ questions for this topic. Please try another.', variant: 'destructive'});
                   setMcqSession(initialQuizSession);
                 }
            } else if (type === 'trueFalse' && 'numQuestions' in data) {
                const result = await generateTrueFalses({ topic: data.topic, numQuestions: data.numQuestions });
                if (result?.questions?.length) {
                    setTrueFalseSession(resetSession(data.topic, result.questions));
                } else {
                  toast({ title: 'Generation Failed', description: 'Could not generate True/False questions for this topic. Please try another.', variant: 'destructive'});
                  setTrueFalseSession(initialQuizSession);
                }
            } else if (type === 'fillBlank' && 'numQuestions' in data) {
                 const result = await generateFillBlanks({ topic: data.topic, numQuestions: data.numQuestions });
                 if (result?.questions?.length) {
                    setFillBlankSession(resetSession(data.topic, result.questions));
                 } else {
                  toast({ title: 'Generation Failed', description: 'Could not generate Fill-the-blank questions for this topic. Please try another.', variant: 'destructive'});
                  setFillBlankSession(initialQuizSession);
                 }
            } else if (type === 'matching' && 'numPairs' in data) {
                const result = await generateMatchingPairs({ topic: data.topic, numPairs: data.numPairs });
                if (result?.pairs?.length) {
                    setMatchingSession(resetSession(data.topic, [], result.pairs));
                } else {
                  toast({ title: 'Generation Failed', description: 'Could not generate Matching Pairs for this topic. Please try another.', variant: 'destructive'});
                  setMatchingSession(initialQuizSession);
                }
            }
        } catch (error) {
            console.error(`Error generating ${type}:`, error);
            toast({ title: 'Error', description: `Failed to generate ${type} quiz. Please try again.`, variant: 'destructive' });
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };
    
    if (authLoading || !isAuthenticated) {
        return <AppShell><div className="flex items-center justify-center h-[calc(100vh-150px)]"><Sparkles className="h-12 w-12 text-accent animate-spin" /><p className="ml-4 text-xl text-muted-foreground">Loading quiz hub...</p></div></AppShell>;
    }
    
    const renderQuizContent = (
        type: QuizType,
        session: QuizSession,
        Component: React.ElementType,
        pointsPerCorrect: number
    ) => {
        if (loading[type]) {
            let numSkeletons = 3;
            if (type === 'mcq') numSkeletons = mcqForm.getValues("numQuestions");
            if (type === 'trueFalse') numSkeletons = trueFalseForm.getValues("numQuestions");
            if (type === 'fillBlank') numSkeletons = fillBlankForm.getValues("numQuestions");
            
            return (
                <div className="space-y-4 mt-6">
                    {[...Array(numSkeletons)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            );
        }

        if (session.totalQuestions > 0 && session.questions.length > 0) {
            return (
                <div className="space-y-6 mt-6">
                    <h2 className="text-2xl font-bold text-center">Quiz on &quot;{session.topic}&quot;</h2>
                    {session.questions.map((q, index) => (
                        <Component 
                            key={index} 
                            question={q} 
                            onCorrect={() => handleCorrectAnswer(pointsPerCorrect)} 
                            onAnswered={(isCorrect: boolean) => handleQuestionAnswered(type, isCorrect)}
                            questionNumber={index + 1} 
                        />
                    ))}
                </div>
            );
        }
        return null;
    }


    return (
        <AppShell>
            <div className="max-w-3xl mx-auto">
                <header className="mb-8 text-center">
                    <ListChecks className="h-16 w-16 text-accent mx-auto mb-4" />
                    <h1 className="text-4xl font-bold mb-2 font-headline">Quiz Hub</h1>
                    <p className="text-lg text-muted-foreground">Generate different types of quizzes on any topic to test your knowledge.</p>
                </header>

                <Tabs defaultValue="mcq" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                        <TabsTrigger value="mcq">Multiple Choice</TabsTrigger>
                        <TabsTrigger value="true-false">True/False</TabsTrigger>
                        <TabsTrigger value="fill-blank">Fill the Blank</TabsTrigger>
                        <TabsTrigger value="matching">Matching Pairs</TabsTrigger>
                    </TabsList>
                    
                    {/* MCQ Tab */}
                    <TabsContent value="mcq">
                        <Card><CardHeader><CardTitle>Generate Multiple-Choice Questions</CardTitle></CardHeader>
                            <CardContent>
                                <Form {...mcqForm}><form onSubmit={mcqForm.handleSubmit(data => handleGenerate('mcq', data))} className="space-y-4">
                                    <FormField control={mcqForm.control} name="topic" render={({ field }) => (<FormItem><ShadFormLabel>Topic</ShadFormLabel><FormControl><Input placeholder="e.g., The French Revolution" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={mcqForm.control} name="numQuestions" render={({ field }) => (<FormItem><ShadFormLabel>Number of Questions (3-10)</ShadFormLabel><FormControl><Input type="number" min="3" max="10" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" className="w-full" disabled={loading.mcq}>{loading.mcq ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                        {renderQuizContent('mcq', mcqSession, McqComponent, POINTS_PER_MCQ_CORRECT)}
                    </TabsContent>

                    {/* True/False Tab */}
                    <TabsContent value="true-false">
                        <Card><CardHeader><CardTitle>Generate True/False Questions</CardTitle></CardHeader>
                            <CardContent>
                                <Form {...trueFalseForm}><form onSubmit={trueFalseForm.handleSubmit(data => handleGenerate('trueFalse', data))} className="space-y-4">
                                     <FormField control={trueFalseForm.control} name="topic" render={({ field }) => (<FormItem><ShadFormLabel>Topic</ShadFormLabel><FormControl><Input placeholder="e.g., Human Anatomy" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={trueFalseForm.control} name="numQuestions" render={({ field }) => (<FormItem><ShadFormLabel>Number of Questions (3-10)</ShadFormLabel><FormControl><Input type="number" min="3" max="10" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" className="w-full" disabled={loading.trueFalse}>{loading.trueFalse ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                        {renderQuizContent('trueFalse', trueFalseSession, TrueFalseComponent, POINTS_PER_TRUE_FALSE_CORRECT)}
                    </TabsContent>

                    {/* Fill the Blank Tab */}
                    <TabsContent value="fill-blank">
                        <Card><CardHeader><CardTitle>Generate Fill-in-the-Blank Questions</CardTitle></CardHeader>
                            <CardContent>
                                <Form {...fillBlankForm}><form onSubmit={fillBlankForm.handleSubmit(data => handleGenerate('fillBlank', data))} className="space-y-4">
                                     <FormField control={fillBlankForm.control} name="topic" render={({ field }) => (<FormItem><ShadFormLabel>Topic</ShadFormLabel><FormControl><Input placeholder="e.g., Famous Poets" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={fillBlankForm.control} name="numQuestions" render={({ field }) => (<FormItem><ShadFormLabel>Number of Questions (3-10)</ShadFormLabel><FormControl><Input type="number" min="3" max="10" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" className="w-full" disabled={loading.fillBlank}>{loading.fillBlank ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                         {renderQuizContent('fillBlank', fillBlankSession, FillBlankComponent, POINTS_PER_FILL_BLANK_CORRECT)}
                    </TabsContent>

                     {/* Matching Pairs Tab */}
                    <TabsContent value="matching">
                        <Card><CardHeader><CardTitle>Generate a Matching Pairs Challenge</CardTitle></CardHeader>
                             <CardContent>
                                <Form {...matchingForm}><form onSubmit={matchingForm.handleSubmit(data => handleGenerate('matching', data))} className="space-y-4">
                                     <FormField control={matchingForm.control} name="topic" render={({ field }) => (<FormItem><ShadFormLabel>Topic</ShadFormLabel><FormControl><Input placeholder="e.g., Chemical Elements" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={matchingForm.control} name="numPairs" render={({ field }) => (<FormItem><ShadFormLabel>Number of Pairs (3-6)</ShadFormLabel><FormControl><Input type="number" min="3" max="6" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" disabled={loading.matching} className="w-full">{loading.matching ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                        {loading.matching && <Skeleton className="h-64 w-full mt-6" />}
                        {matchingSession.pairs && matchingSession.totalQuestions > 0 && <MatchingPairsComponent pairs={matchingSession.pairs} onCorrect={(points) => addPoints(points)} onAnswered={(isCorrect) => handleMatchingAnswered(isCorrect)} />}
                    </TabsContent>

                </Tabs>

                {!loading.mcq && !loading.trueFalse && !loading.fillBlank && !loading.matching && mcqSession.totalQuestions === 0 && trueFalseSession.totalQuestions === 0 && fillBlankSession.totalQuestions === 0 && matchingSession.totalQuestions === 0 &&(
                    <Card className="text-center p-8 bg-secondary mt-8">
                        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <CardTitle className="text-xl font-headline mb-2">No Quiz Generated Yet</CardTitle>
                        <CardDescription>
                        Choose a quiz type, enter a topic, and click &quot;Generate&quot; to start testing your knowledge!
                        </CardDescription>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}

    