
"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel as ShadFormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, Lightbulb, Sparkles, CheckCircle2, XCircle, Shuffle, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { POINTS_FOR_QUIZ_QUESTION_CORRECT } from '@/lib/constants';

import { generateMcq, type GenerateMcqOutput } from '@/ai/flows/generate-mcq-flow';
import { generateTrueFalse, type GenerateTrueFalseOutput } from '@/ai/flows/generate-true-false-flow';
import { generateFillBlank, type GenerateFillBlankOutput } from '@/ai/flows/generate-fill-blank-flow';
import { generateMatchingPairs, type GenerateMatchingPairsOutput, type GenerateMatchingPairsInput } from '@/ai/flows/generate-matching-pairs-flow';


// Schemas
const QuizTopicSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }),
});
type QuizTopicFormData = z.infer<typeof QuizTopicSchema>;

const MatchingTopicSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }),
  numPairs: z.coerce.number().min(3, 'Must have at least 3 pairs.').max(6, 'Cannot have more than 6 pairs.').default(4),
});
type MatchingTopicFormData = z.infer<typeof MatchingTopicSchema>;


// --- Interactive Question Components ---

const McqComponent = ({ question, onCorrect }: { question: GenerateMcqOutput, onCorrect: () => void }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    if (index === question.correctAnswerIndex) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_FOR_QUIZ_QUESTION_CORRECT} XP!` });
    } else {
      toast({ title: 'Not quite!', variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-md mt-6">
      <CardHeader><CardTitle className="font-headline text-lg">{question.question}</CardTitle></CardHeader>
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

const TrueFalseComponent = ({ question, onCorrect }: { question: GenerateTrueFalseOutput, onCorrect: () => void }) => {
  const [selected, setSelected] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleSelect = (answer: boolean) => {
    if (selected !== null) return;
    setSelected(answer);
    if (answer === question.isTrue) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_FOR_QUIZ_QUESTION_CORRECT} XP!` });
    } else {
      toast({ title: 'Incorrect!', variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-md mt-6">
      <CardHeader><CardTitle className="font-headline text-lg">{question.statement}</CardTitle></CardHeader>
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

const FillBlankComponent = ({ question, onCorrect }: { question: GenerateFillBlankOutput, onCorrect: () => void }) => {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleCheck = () => {
    if (submitted) return;
    setSubmitted(true);
    if (answer.trim().toLowerCase() === question.answer.toLowerCase()) {
      onCorrect();
      toast({ title: 'Correct!', description: `+${POINTS_FOR_QUIZ_QUESTION_CORRECT} XP!` });
    } else {
      toast({ title: 'Not quite!', description: `Correct answer: ${question.answer}`, variant: 'destructive' });
    }
  };
  const parts = question.question.split('[BLANK]');
  return (
    <Card className="shadow-md mt-6">
      <CardHeader><CardTitle className="font-headline text-lg">Fill in the blank</CardTitle></CardHeader>
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

const MatchingPairsComponent = ({ pairs, onCorrect }: { pairs: GenerateMatchingPairsOutput['pairs'], onCorrect: (points: number) => void }) => {
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

        if (pairs[selectedTerm.id].definition === def) {
            const newMatchedPairs = [...matchedPairs, selectedTerm.id];
            setMatchedPairs(newMatchedPairs);
            toast({ title: 'Match Found!', description: 'Great job!' });
            if (newMatchedPairs.length === pairs.length) {
                toast({ title: 'Challenge Complete!', description: `You earned ${POINTS_FOR_QUIZ_QUESTION_CORRECT * pairs.length} XP!` });
                onCorrect(POINTS_FOR_QUIZ_QUESTION_CORRECT * pairs.length);
            }
        } else {
            toast({ title: 'Not a match!', description: 'Try again.', variant: 'destructive' });
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
export default function QuizPage() {
    const { isAuthenticated, loading: authLoading, addPoints } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    // State for each quiz type
    const [mcq, setMcq] = useState<GenerateMcqOutput | null>(null);
    const [trueFalse, setTrueFalse] = useState<GenerateTrueFalseOutput | null>(null);
    const [fillBlank, setFillBlank] = useState<GenerateFillBlankOutput | null>(null);
    const [matchingPairs, setMatchingPairs] = useState<GenerateMatchingPairsOutput | null>(null);

    const [loading, setLoading] = useState({ mcq: false, trueFalse: false, fillBlank: false, matching: false });

    // Forms
    const mcqForm = useForm<QuizTopicFormData>({ resolver: zodResolver(QuizTopicSchema), defaultValues: { topic: '' } });
    const trueFalseForm = useForm<QuizTopicFormData>({ resolver: zodResolver(QuizTopicSchema), defaultValues: { topic: '' } });
    const fillBlankForm = useForm<QuizTopicFormData>({ resolver: zodResolver(QuizTopicSchema), defaultValues: { topic: '' } });
    const matchingForm = useForm<MatchingTopicFormData>({ resolver: zodResolver(MatchingTopicSchema), defaultValues: { topic: '', numPairs: 4 } });

    // Auth redirection
    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login?redirect=/quiz');
    }, [authLoading, isAuthenticated, router]);

    const handleGenerate = async (type: keyof typeof loading, topic: string, options?: any) => {
        setLoading(prev => ({ ...prev, [type]: true }));
        try {
            let result;
            if (type === 'mcq') result = await generateMcq({ topic });
            else if (type === 'trueFalse') result = await generateTrueFalse({ topic });
            else if (type === 'fillBlank') result = await generateFillBlank({ topic });
            else if (type === 'matching') result = await generateMatchingPairs({ topic, numPairs: options.numPairs });
            
            if (type === 'mcq') setMcq(result as GenerateMcqOutput);
            if (type === 'trueFalse') setTrueFalse(result as GenerateTrueFalseOutput);
            if (type === 'fillBlank') setFillBlank(result as GenerateFillBlankOutput);
            if (type === 'matching') setMatchingPairs(result as GenerateMatchingPairsOutput);
            
        } catch (error) {
            console.error(`Error generating ${type}:`, error);
            toast({ title: 'Error', description: `Failed to generate ${type} question. Please try again.`, variant: 'destructive' });
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };
    
    if (authLoading || !isAuthenticated) {
        return <AppShell><div className="flex items-center justify-center h-[calc(100vh-150px)]"><Sparkles className="h-12 w-12 text-accent animate-spin" /><p className="ml-4 text-xl text-muted-foreground">Loading quiz hub...</p></div></AppShell>;
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
                        <Card><CardHeader><CardTitle>Generate a Multiple-Choice Question</CardTitle></CardHeader>
                            <CardContent>
                                <Form {...mcqForm}><form onSubmit={mcqForm.handleSubmit(data => handleGenerate('mcq', data.topic))} className="flex gap-2 items-baseline">
                                    <FormField control={mcqForm.control} name="topic" render={({ field }) => (<FormItem className="flex-grow"><ShadFormLabel className="sr-only">Topic</ShadFormLabel><FormControl><Input placeholder="e.g., The French Revolution" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" disabled={loading.mcq}>{loading.mcq ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                        {loading.mcq && <Skeleton className="h-48 w-full mt-6" />}
                        {mcq && <McqComponent question={mcq} onCorrect={() => addPoints(POINTS_FOR_QUIZ_QUESTION_CORRECT)} />}
                    </TabsContent>

                    {/* True/False Tab */}
                    <TabsContent value="true-false">
                        <Card><CardHeader><CardTitle>Generate a True/False Question</CardTitle></CardHeader>
                            <CardContent>
                                <Form {...trueFalseForm}><form onSubmit={trueFalseForm.handleSubmit(data => handleGenerate('trueFalse', data.topic))} className="flex gap-2 items-baseline">
                                    <FormField control={trueFalseForm.control} name="topic" render={({ field }) => (<FormItem className="flex-grow"><ShadFormLabel className="sr-only">Topic</ShadFormLabel><FormControl><Input placeholder="e.g., Human Anatomy" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" disabled={loading.trueFalse}>{loading.trueFalse ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                        {loading.trueFalse && <Skeleton className="h-32 w-full mt-6" />}
                        {trueFalse && <TrueFalseComponent question={trueFalse} onCorrect={() => addPoints(POINTS_FOR_QUIZ_QUESTION_CORRECT)} />}
                    </TabsContent>

                    {/* Fill the Blank Tab */}
                    <TabsContent value="fill-blank">
                        <Card><CardHeader><CardTitle>Generate a Fill-in-the-Blank Question</CardTitle></CardHeader>
                            <CardContent>
                                <Form {...fillBlankForm}><form onSubmit={fillBlankForm.handleSubmit(data => handleGenerate('fillBlank', data.topic))} className="flex gap-2 items-baseline">
                                    <FormField control={fillBlankForm.control} name="topic" render={({ field }) => (<FormItem className="flex-grow"><ShadFormLabel className="sr-only">Topic</ShadFormLabel><FormControl><Input placeholder="e.g., Famous Poets" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" disabled={loading.fillBlank}>{loading.fillBlank ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                        {loading.fillBlank && <Skeleton className="h-32 w-full mt-6" />}
                        {fillBlank && <FillBlankComponent question={fillBlank} onCorrect={() => addPoints(POINTS_FOR_QUIZ_QUESTION_CORRECT)} />}
                    </TabsContent>

                     {/* Matching Pairs Tab */}
                    <TabsContent value="matching">
                        <Card><CardHeader><CardTitle>Generate a Matching Pairs Challenge</CardTitle></CardHeader>
                             <CardContent>
                                <Form {...matchingForm}><form onSubmit={matchingForm.handleSubmit(data => handleGenerate('matching', data.topic, { numPairs: data.numPairs }))} className="space-y-4">
                                     <FormField control={matchingForm.control} name="topic" render={({ field }) => (<FormItem><ShadFormLabel>Topic</ShadFormLabel><FormControl><Input placeholder="e.g., Chemical Elements" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={matchingForm.control} name="numPairs" render={({ field }) => (<FormItem><ShadFormLabel>Number of Pairs (3-6)</ShadFormLabel><FormControl><Input type="number" min="3" max="6" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" disabled={loading.matching} className="w-full">{loading.matching ? 'Generating...' : 'Generate'}</Button>
                                </form></Form>
                            </CardContent>
                        </Card>
                        {loading.matching && <Skeleton className="h-64 w-full mt-6" />}
                        {matchingPairs && <MatchingPairsComponent pairs={matchingPairs.pairs} onCorrect={(points) => addPoints(points)} />}
                    </TabsContent>

                </Tabs>
            </div>
        </AppShell>
    );
}


    

    
